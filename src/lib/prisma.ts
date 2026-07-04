import { PrismaClient } from "@/generated/prisma"
import { PrismaPg } from "@prisma/adapter-pg"
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager"

const globalForPrisma = globalThis as unknown as {
  prismaClient: PrismaClient | undefined
  prismaReconnecting: Promise<void> | undefined
}

function buildConnectionString(user: string, password: string): string {
  const host = process.env.DB_HOST
  const name = process.env.DB_NAME
  const encoded = encodeURIComponent(password)
  return `postgresql://${user}:${encoded}@${host}:5432/${name}?sslmode=no-verify`
}

function createClient(connectionString: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({ adapter })
}

async function fetchFreshConnectionString(): Promise<string> {
  const secretId = process.env.DB_SECRET_ID
  if (!secretId) throw new Error("DB_SECRET_ID is not set")
  const sm = new SecretsManagerClient({ region: "ap-northeast-1" })
  const res = await sm.send(new GetSecretValueCommand({ SecretId: secretId }))
  const secret = JSON.parse(res.SecretString!)
  return buildConnectionString(secret.username, secret.password)
}

let client: PrismaClient = globalForPrisma.prismaClient ?? createClient(process.env.DATABASE_URL!)
if (process.env.NODE_ENV !== "production") globalForPrisma.prismaClient = client

async function reconnect(): Promise<void> {
  if (!globalForPrisma.prismaReconnecting) {
    globalForPrisma.prismaReconnecting = (async () => {
      console.log("[prisma] P1000検知: Secrets Managerから最新パスワードを取得し再接続します")
      const oldClient = client
      const newConnectionString = await fetchFreshConnectionString()
      client = createClient(newConnectionString)
      if (process.env.NODE_ENV !== "production") globalForPrisma.prismaClient = client
      oldClient.$disconnect().catch(() => {})
      console.log("[prisma] 再接続完了")
    })()
  }
  await globalForPrisma.prismaReconnecting
  globalForPrisma.prismaReconnecting = undefined
}

function isAuthError(e: unknown): boolean {
  return !!e && typeof e === "object" && "code" in e && (e as { code?: unknown }).code === "P1000"
}

function wrapDelegate(getDelegate: () => unknown): unknown {
  return new Proxy(
    {},
    {
      get(_target, prop) {
        const delegate = getDelegate() as Record<string | symbol, unknown>
        const value = delegate[prop]
        if (typeof value === "function") {
          return async (...args: unknown[]) => {
            try {
              return await (value as (...a: unknown[]) => unknown).apply(delegate, args)
            } catch (e) {
              if (isAuthError(e)) {
                await reconnect()
                const freshDelegate = getDelegate() as Record<string | symbol, unknown>
                const freshValue = freshDelegate[prop] as (...a: unknown[]) => unknown
                return await freshValue.apply(freshDelegate, args)
              }
              throw e
            }
          }
        }
        if (value && typeof value === "object") {
          return wrapDelegate(() => (getDelegate() as Record<string | symbol, unknown>)[prop])
        }
        return value
      },
    }
  )
}

export const prisma = wrapDelegate(() => client) as PrismaClient
