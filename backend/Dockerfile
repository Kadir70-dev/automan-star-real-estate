FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
# The current repository does not track go.sum. 'go mod download' on its own
# can leave the sums required by Go 1.23's build unresolved in a clean clone.
# Resolve and verify the pinned module graph inside this isolated builder.
RUN go mod tidy && go mod verify
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /api ./cmd/api \
 && CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /bootstrap ./cmd/bootstrap
FROM alpine:3.21
RUN addgroup -S app && adduser -S -G app app && mkdir -p /app/media && chown app:app /app/media
COPY --from=build /api /api
COPY --from=build /bootstrap /bootstrap
USER app
EXPOSE 8080
ENTRYPOINT ["/api"]
