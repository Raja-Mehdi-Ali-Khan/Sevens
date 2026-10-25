const LOCAL_WEB_ORIGIN = "http://localhost:5173";

export function parseClientOrigins(
  value: string | undefined,
  nodeEnv = process.env.NODE_ENV,
): string[] {
  const values = (value ?? "").split(",").map((origin) => origin.trim()).filter(Boolean);
  if (values.length === 0) {
    return nodeEnv === "production" ? [] : [LOCAL_WEB_ORIGIN];
  }

  return [...new Set(values.map((origin) => {
    let parsed: URL;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(`Invalid CLIENT_ORIGIN value: ${origin}`);
    }
    if (
      (parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      parsed.username !== "" ||
      parsed.password !== "" ||
      parsed.pathname !== "/" ||
      parsed.search !== "" ||
      parsed.hash !== ""
    ) {
      throw new Error(`CLIENT_ORIGIN values must be HTTP or HTTPS origins: ${origin}`);
    }
    return parsed.origin;
  }))];
}
