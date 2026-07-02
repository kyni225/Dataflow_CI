export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode = 400,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) {
    return Response.json(
      {
        error: error.message,
        details: error.details
      },
      { status: error.statusCode }
    );
  }

  if (isPrismaError(error)) {
    if (error.code === 'P2002') {
      return Response.json(
        {
          error: "Une source avec ce nom existe deja."
        },
        { status: 409 }
      );
    }
    return Response.json(
      {
        error: "Erreur de base de donnees."
      },
      { status: 500 }
    );
  }

  if (isZodError(error)) {
    return Response.json(
      {
        error: "Payload invalide.",
        details: error.flatten()
      },
      { status: 400 }
    );
  }

  console.error(error);

  return Response.json(
    {
      error: "Une erreur inattendue est survenue."
    },
    { status: 500 }
  );
}

function isZodError(error: unknown): error is {
  flatten: () => unknown;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    error.name === "ZodError" &&
    "flatten" in error &&
    typeof error.flatten === "function"
  );
}

function isPrismaError(error: unknown): error is {
  code: string;
} {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  );
}
