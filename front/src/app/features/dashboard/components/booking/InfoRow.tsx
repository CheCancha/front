export const InfoRow = ({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex items-start gap-4 py-1">
    <Icon className="h-5 w-5 text-gray-400 mt-0.5" />
    <div className="flex-1">
      <p className="text-sm text-gray-500">{label}</p>
      <div className="text-base font-semibold text-gray-800">{children}</div>
    </div>
  </div>
);