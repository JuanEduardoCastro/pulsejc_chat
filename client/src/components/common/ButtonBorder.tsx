type ButtonBorderProps = {
  type: 'submit' | 'button' | 'reset';
  text?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  textClassName?: string;
  textStyle?: React.CSSProperties;
};

function ButtonBorder({
  type,
  text,
  children,
  disabled,
  onClick,
  buttonClassName,
  buttonStyle,
  textClassName,
  textStyle,
}: ButtonBorderProps) {
  return (
    <button
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={
        buttonClassName ??
        'mt-1 w-full flex items-center justify-center border rounded-md px-4 py-2 font-medium disabled:opacity-60'
      }
      style={{ ...buttonStyle, color: 'var(--text)' }}
    >
      <div>
        {text && (
          <span className={textClassName} style={textStyle}>
            {text}
          </span>
        )}
        {children && children}
      </div>
    </button>
  );
}

export default ButtonBorder;
