/** One reason a piece of content was rejected, tied to the field that caused it. */
export interface ContentValidationIssue {
  /** Dotted path to the field, e.g. `sections.1.body`. Empty for the whole value. */
  path: string
  /** Why it was rejected, in words the admin can act on. */
  message: string
}

/** Thrown when content does not satisfy the content schemas. Carries every failing field. */
export class ContentValidationError extends Error {
  /** Every field that failed, and why. */
  readonly issues: ContentValidationIssue[]

  /**
   * @param issues The failing fields. The message is built from them.
   */
  constructor(issues: ContentValidationIssue[]) {
    super(describe(issues))
    this.name = 'ContentValidationError'
    this.issues = issues
  }
}

/**
 * Builds the error message, naming each failing field and its reason.
 * @param issues The failing fields.
 * @returns A one-line summary.
 */
function describe(issues: ContentValidationIssue[]): string {
  const parts = issues.map((issue) => (issue.path ? `${issue.path}: ${issue.message}` : issue.message))
  return `Content is invalid — ${parts.join('; ')}`
}
