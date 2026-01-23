FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /app

# Copy pom and download dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src src

# Build the application
RUN mvn package -DskipTests -B

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Copy the built JAR
COPY --from=builder /app/target/*.jar app.jar

# Default port values
ENV GATEWAY_HTTP_PORT=8080
ENV GATEWAY_WS_PORT=8081

EXPOSE ${GATEWAY_HTTP_PORT} ${GATEWAY_WS_PORT}

CMD ["java", "-jar", "app.jar"]
