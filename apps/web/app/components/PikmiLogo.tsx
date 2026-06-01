export default function PikmiLogo({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/pikmilogo.png"
      alt="pikmi logo"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}
