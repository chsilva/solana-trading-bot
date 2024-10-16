import pino from 'pino';

const transport = pino.transport({
  target: 'pino-pretty',
});

export const logger = pino(
  {
    level: 'info',
    redact: [],
    serializers: {
      error: pino.stdSerializers.err,
    },
    base: undefined,
  },
  transport,
);
