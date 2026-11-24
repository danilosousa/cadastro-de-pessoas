# syntax=docker/dockerfile:1

# ---------- Estágio 1: build (JDK + Maven Wrapper) ----------
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app

# Primeiro só o que define as dependências: enquanto o pom.xml não mudar,
# esta camada fica em cache e o "download da internet" não se repete.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B -q dependency:go-offline

# Depois o código. Os testes rodam fora do Docker (./mvnw verify), pois
# precisam do próprio Docker para o Testcontainers.
COPY src/ src/
RUN ./mvnw -B -q package -DskipTests \
 && java -Djarmode=tools -jar target/prova-fullstack-*.jar extract --layers --launcher --destination target/extraido

# ---------- Estágio 2: runtime (só JRE, sem Maven nem código-fonte) ----------
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Nunca rodar como root dentro do container.
RUN addgroup -S app && adduser -S app -G app

# Camadas do Spring Boot: dependências (mudam pouco) antes do código (muda sempre),
# para que um rebuild só reenvie a camada pequena.
COPY --from=build /app/target/extraido/dependencies/ ./
COPY --from=build /app/target/extraido/spring-boot-loader/ ./
COPY --from=build /app/target/extraido/snapshot-dependencies/ ./
COPY --from=build /app/target/extraido/application/ ./

USER app
EXPOSE 8080
ENTRYPOINT ["java", "org.springframework.boot.loader.launch.JarLauncher"]
