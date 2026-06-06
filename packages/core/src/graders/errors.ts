export class GraderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GraderError';
  }
}

export class NotImplementedGraderError extends GraderError {
  constructor(message: string) {
    super(message);
    this.name = 'NotImplementedGraderError';
  }
}
