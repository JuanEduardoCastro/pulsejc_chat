type ButtonMenuProps = {
  type: 'submit' | 'button' | 'reset';
  children?: React.ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
};

function ButtonMenu({
  type,
  children,
  disabled,
  onClick,
  buttonClassName,
  buttonStyle,
}: ButtonMenuProps) {
  return (
    <>
      <button
        onClick={onClick}
        type={type}
        disabled={disabled}
        className={`${buttonClassName} block w-full px-4 py-2 text-sm hover:opacity-80 `}
        style={buttonStyle}
      >
        {children}
      </button>
    </>
  );
}

export default ButtonMenu;
