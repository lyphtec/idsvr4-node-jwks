# Using multi stage build as per https://docs.docker.com/engine/examples/dotnetcore/
FROM microsoft/aspnetcore-build:2.0 AS build-env
WORKDIR /app

COPY ["idserv4.csproj", "./"]
RUN dotnet restore

COPY . .
RUN dotnet publish -c Debug -o out

# Build runtime image
FROM microsoft/aspnetcore:2.0
WORKDIR /app
COPY --from=build-env /app/out .
EXPOSE 5000
ENTRYPOINT ["dotnet", "IdServ.dll"]
