import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:bg-cream group-[.toaster]:text-ink group-[.toaster]:border-sand group-[.toaster]:shadow-lg font-poppins",
          description: "group-[.toast]:text-ink/60",
          actionButton: "group-[.toast]:bg-rust group-[.toast]:text-cream",
          cancelButton: "group-[.toast]:bg-sand/30 group-[.toast]:text-ink",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
