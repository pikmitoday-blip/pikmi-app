export default function PikmiLogo({ size = 32 }: { size?: number }) {
  return (
    <img
      src="/pikmilogo.jpg"
      alt="pikmi logo"
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
}
