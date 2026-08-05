type ErrorMessageProps = {
  message: string;
  messageStyle?: React.CSSProperties;
  errorVisible?: boolean;
};

function ErrorMessage({
  message,
  messageStyle,
  errorVisible = true,
}: ErrorMessageProps) {
  return (
    <div className={`h-5 mt-1`}>
      <p
        className={`text-sm text-red-500 ${errorVisible ? 'block' : 'hidden'}`}
        style={messageStyle}
      >
        {message}
      </p>
    </div>
  );
}

export default ErrorMessage;
