export function isDevelopmentMode(env = import.meta.env) {
  return Boolean(env?.DEV);
}

export function logErrorDev(messageOrError, errorOrEnv, maybeEnv) {
  const hasMessage = typeof messageOrError === "string";
  const env = hasMessage ? maybeEnv : errorOrEnv;

  if (!isDevelopmentMode(env)) return;

  if (hasMessage) {
    console.error(messageOrError, errorOrEnv);
    return;
  }

  console.error(messageOrError);
}
