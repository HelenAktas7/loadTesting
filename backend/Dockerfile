# Aşama 1: Derleme (Build Stage)
FROM golang:1.23-alpine AS builder

WORKDIR /app

# Kaynak kodu kopyala
COPY main.go .

# CGO devre dışı bırakılmış, boyut ve sembol optimizasyonu yapılmış (stripped) statik ikili (binary) üret
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o mock-backend main.go

# Aşama 2: Çalıştırma (Runtime Stage)
# Sıfır yük getiren minimal Alpine imajı (~8MB)
FROM alpine:3.20

WORKDIR /app

# Yalnızca derlenmiş ikiliyi taşı
COPY --from=builder /app/mock-backend .

# Güvenlik ve yalınlık için kök olmayan (non-root) kullanıcı
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 8080

CMD ["./mock-backend"]
