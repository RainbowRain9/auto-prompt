FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
USER root
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

# 设置时区为中国标准时间
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

FROM node:20.18-alpine3.21 as web
WORKDIR /src
COPY web .
RUN yarn
RUN npm i  --force
RUN yarn run build


FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/Console.Service/Console.Service.csproj", "src/Console.Service/"]
COPY ["src/Provider/Console.Provider.Sqlite/Console.Provider.Sqlite.csproj", "src/Provider/Console.Provider.Sqlite/"]
COPY ["src/Console.Core/Console.Core.csproj", "src/Console.Core/"]
COPY ["src/Provider/Console.Provider.PostgreSQL/Console.Provider.PostgreSQL.csproj", "src/Provider/Console.Provider.PostgreSQL/"]
RUN dotnet restore "src/Console.Service/Console.Service.csproj"
# 设置时区
ENV TZ=Asia/Shanghai
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone
COPY . .
WORKDIR "/src/src/Console.Service"
RUN dotnet build "./Console.Service.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./Console.Service.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
COPY --from=web /src/dist ./wwwroot
ENTRYPOINT ["dotnet", "Console.Service.dll"]
