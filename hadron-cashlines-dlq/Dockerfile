FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/hadron-cashlines-dlq-1.0.0-SNAPSHOT.jar app.jar
EXPOSE 8095
ENV JAVA_OPTS="-XX:MaxRAMPercentage=75"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
