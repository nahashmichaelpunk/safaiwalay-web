/**
 * Human-readable message from Supabase/PostgREST errors or thrown values.
 */
export function getSupabaseErrorMessage(error: unknown): string {
  if (error === null || error === undefined) {
    return 'Something went wrong';
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message;
  }
  if (
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return 'Something went wrong';
}
