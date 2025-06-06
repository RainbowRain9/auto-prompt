import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import '@ant-design/v5-patch-for-react-19';
import { unstableSetRender } from 'antd';


unstableSetRender((node, container) => {
    // @ts-ignore
    container._reactRoot ||= createRoot(container);
    // @ts-ignore
    const root = container._reactRoot;
    root.render(node);
    return async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
      root.unmount();
    };
  });


createRoot(document.getElementById('root')!).render(
    <App />,
)
