FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/spring-multitenant-lab-1.0.0-SNAPSHOT.jar app.jar
EXPOSE 8096
ENTRYPOINT ["java","-jar","app.jar"]
