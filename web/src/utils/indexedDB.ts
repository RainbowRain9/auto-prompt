// IndexedDB 工具类，用于存储模型评估数据
export interface EvaluationRecord {
  id: string;
  timestamp: number;
  date: string;
  title: string;
  config: {
    models: string[];
    prompt: string;
    request: string;
    executionCount: number;
    enableOptimization: boolean;
    exampleId?: string;
    exampleTitle?: string;
    exampleCategory?: string;
  };
  results: {
    [model: string]: {
      score: number;
      description: string;
      comment: string;
      tags: string[];
      executionCount: number;
      startTime: number;
      endTime: number;
      duration: number;
    };
  };
  statistics: {
    totalModels: number;
    completedModels: number;
    avgScore: number;
    totalTime: number;
    scoreDistribution: { [range: string]: number };
    tagDistribution: { [tag: string]: number };
  };
}

class EvaluationDB {
  private db: IDBDatabase | null = null;
  private readonly dbName = 'ModelEvaluationDB';
  private readonly version = 1;
  private readonly storeName = 'evaluations';

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('无法打开数据库'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建评估记录存储
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('date', 'date', { unique: false });
        }
      };
    });
  }

  async saveEvaluation(record: EvaluationRecord): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.put(record);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('保存评估记录失败'));
    });
  }

  async getAllEvaluations(): Promise<EvaluationRecord[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const index = store.index('timestamp');
      const request = index.getAll();

      request.onsuccess = () => {
        // 按时间戳降序排列（最新的在前）
        const results = request.result.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      request.onerror = () => reject(new Error('获取评估记录失败'));
    });
  }

  async getEvaluationById(id: string): Promise<EvaluationRecord | null> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error('获取评估记录失败'));
    });
  }

  async deleteEvaluation(id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('删除评估记录失败'));
    });
  }

  async clearAllEvaluations(): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('清空评估记录失败'));
    });
  }

  // 获取统计数据
  async getStatistics(): Promise<{
    totalEvaluations: number;
    totalModelsEvaluated: number;
    avgScore: number;
    mostUsedModels: { [model: string]: number };
    scoreDistribution: { [range: string]: number };
    categoryDistribution: { [category: string]: number };
  }> {
    const evaluations = await this.getAllEvaluations();
    
    const stats = {
      totalEvaluations: evaluations.length,
      totalModelsEvaluated: 0,
      avgScore: 0,
      mostUsedModels: {} as { [model: string]: number },
      scoreDistribution: {
        '90-100': 0,
        '80-89': 0,
        '70-79': 0,
        '60-69': 0,
        '0-59': 0
      },
      categoryDistribution: {} as { [category: string]: number }
    };

    if (evaluations.length === 0) return stats;

    let totalScore = 0;
    let totalScoreCount = 0;

    evaluations.forEach(evaluation => {
      // 统计模型使用次数
      evaluation.config.models.forEach(model => {
        stats.mostUsedModels[model] = (stats.mostUsedModels[model] || 0) + 1;
      });

      // 统计评分分布
      Object.values(evaluation.results).forEach(result => {
        totalScore += result.score;
        totalScoreCount++;
        
        if (result.score >= 90) stats.scoreDistribution['90-100']++;
        else if (result.score >= 80) stats.scoreDistribution['80-89']++;
        else if (result.score >= 70) stats.scoreDistribution['70-79']++;
        else if (result.score >= 60) stats.scoreDistribution['60-69']++;
        else stats.scoreDistribution['0-59']++;
      });

      // 统计分类分布
      if (evaluation.config.exampleCategory) {
        const category = evaluation.config.exampleCategory;
        stats.categoryDistribution[category] = (stats.categoryDistribution[category] || 0) + 1;
      }

      stats.totalModelsEvaluated += evaluation.statistics.completedModels;
    });

    stats.avgScore = totalScoreCount > 0 ? totalScore / totalScoreCount : 0;

    return stats;
  }
}

// 导出单例实例
export const evaluationDB = new EvaluationDB(); 