type SeparatorProps = {
  height?: string;
};
function Separator({ height = 'h-4' }: SeparatorProps) {
  return <div className={height} />;
}
export default Separator;
