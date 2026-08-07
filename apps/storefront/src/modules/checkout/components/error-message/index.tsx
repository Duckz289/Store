const ErrorMessage = ({
  error,
  id,
  'data-testid': dataTestid,
}: {
  error?: string | null
  id?: string
  'data-testid'?: string
}) => {
  if (!error) {
    return null
  }

  return (
    <div
      id={id}
      className="pt-2 text-rose-500 text-small-regular"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid={dataTestid}
    >
      <span>{error}</span>
    </div>
  )
}

export default ErrorMessage
