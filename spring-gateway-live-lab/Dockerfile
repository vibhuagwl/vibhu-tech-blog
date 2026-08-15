# Multi-stage image for ECS Fargate / docker-compose.aws.yml
FROM eclipse-temurin:21-jdk-jammy AS build
WORKDIR /workspace
COPY pom.xml .
COPY eureka-server/pom.xml eureka-server/pom.xml
COPY user-service/pom.xml user-service/pom.xml
COPY order-service/pom.xml order-service/pom.xml
COPY payment-service/pom.xml payment-service/pom.xml
COPY api-gateway/pom.xml api-gateway/pom.xml
RUN apt-get update && apt-get install -y --no-install-recommends maven \
  && mvn -q -pl user-service,order-service,payment-service,api-gateway -am dependency:go-offline \
  && rm -rf /var/lib/apt/lists/*
COPY user-service user-service
COPY order-service order-service
COPY payment-service payment-service
COPY api-gateway api-gateway
COPY eureka-server eureka-server
ARG MODULE
RUN mvn -q -pl ${MODULE} -am package -DskipTests \
  && ls -la ${MODULE}/target/*.jar

FROM eclipse-temurin:21-jre-jammy
RUN apt-get update && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /app
ARG MODULE
ARG JAR_FILE
COPY --from=build /workspace/${MODULE}/target/${JAR_FILE} /app/app.jar
ENV SPRING_PROFILES_ACTIVE=aws
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0"
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec java $JAVA_OPTS -jar /app/app.jar"]
