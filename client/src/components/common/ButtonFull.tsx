type ButtonFullProps = {
  type: 'submit' | 'button' | 'reset';
  text?: string;
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  textClassName?: string;
  textStyle?: React.CSSProperties;
  icon?: React.ReactNode;
  atPosition?:
    'flex-col' | 'flex-row' | 'flex-col-reverse' | 'flex-row-reverse';
};

function ButtonFull({
  type,
  text,
  children,
  disabled,
  onClick,
  buttonClassName,
  buttonStyle,
  textClassName,
  textStyle,
  icon,
  atPosition,
}: ButtonFullProps) {
  return (
    <>
      <button
        onClick={onClick}
        type={type}
        disabled={disabled}
        className={
          buttonClassName ??
          `mt-1 flex w-full items-center justify-center rounded-md px-4 py-2 font-medium text-white disabled:opacity-60`
        }
        style={buttonStyle}
      >
        <div className={atPosition || 'flex-row'}>
          {icon && icon}
          {text && (
            <span className={textClassName} style={textStyle}>
              {text}
            </span>
          )}
          {children && children}
        </div>
      </button>
    </>
  );
}

export default ButtonFull;
