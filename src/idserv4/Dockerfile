FROM microsoft/dotnet:2-sdk

WORKDIR /app

COPY ["idserv4.csproj", "./"]

RUN dotnet restore

COPY . .

RUN dotnet publish -c Debug

EXPOSE 5000
ENTRYPOINT ["dotnet", "run"]
