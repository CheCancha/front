"use client";

import { useState, useEffect } from "react";
import { Coupon } from "@prisma/client";
import { toast } from "react-hot-toast";
import { Plus, Tag } from "lucide-react";
import {
  Formik,
  Form,
  Field,
  ErrorMessage,
  FormikHelpers,
  FieldProps,
} from "formik";
import * as Yup from "yup";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { Spinner } from "@/shared/components/ui/Spinner";
import { cn } from "@/shared/lib/utils";

// --- Esquema de Validación con Yup ---
const couponValidationSchema = Yup.object({
  code: Yup.string()
    .min(3, "Mínimo 3 caracteres.")
    .max(20, "Máximo 20 caracteres.")
    .required("El código es requerido."),
  description: Yup.string(),
  discountType: Yup.mixed<"PERCENTAGE" | "FIXED_AMOUNT">()
    .oneOf(["PERCENTAGE", "FIXED_AMOUNT"])
    .required(),
  discountValue: Yup.number()
    .min(1, "El valor debe ser mayor a 0.")
    .required("El valor es requerido."),
  validUntil: Yup.string().nullable(),
  maxUses: Yup.number().min(1, "Debe ser al menos 1.").nullable(),
  isActive: Yup.boolean(),
});

type CouponFormData = Yup.InferType<typeof couponValidationSchema>;

const CouponRow = ({
  coupon,
  onToggleActive,
}: {
  coupon: Coupon;
  onToggleActive: (couponId: string, currentStatus: boolean) => void;
}) => (
  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-md">
    <div className="flex items-center gap-4">
      <div
        className={`p-2 rounded-full ${
          coupon.isActive ? "bg-green-100" : "bg-gray-100"
        }`}
      >
        <Tag
          className={`w-6 h-6 ${
            coupon.isActive ? "text-green-600" : "text-gray-500"
          }`}
        />
      </div>
      <div>
        <p className="font-mono text-lg font-bold">{coupon.code}</p>
        <p className="text-sm text-gray-500">
          {coupon.description || "Sin descripción"}
        </p>
        <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
          <span className="font-semibold">
            {coupon.discountType === "PERCENTAGE"
              ? `${coupon.discountValue}% OFF`
              : `$${coupon.discountValue.toLocaleString("es-AR")} ARS OFF`}
          </span>
          <span>•</span>
          <span>
            Usado {coupon.uses}
            {coupon.maxUses ? `/${coupon.maxUses}` : ""} veces
          </span>
          {coupon.validUntil && (
            <span>
              • Vence
              {format(new Date(coupon.validUntil), "dd MMM yyyy", {
                locale: es,
              })}
            </span>
          )}
        </div>
      </div>
    </div>
    <div className="flex items-center gap-2 mt-4 sm:mt-0">
      <span className="text-sm font-medium">
        {coupon.isActive ? "Activo" : "Inactivo"}
      </span>
      <Switch
        checked={coupon.isActive}
        onCheckedChange={() => onToggleActive(coupon.id, coupon.isActive)}
      />
    </div>
  </div>
);

export function CouponsManager({ complexId }: { complexId: string }) {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    const fetchCoupons = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/complex/${complexId}/coupons`);
        if (!response.ok) throw new Error("No se pudieron cargar los cupones.");
        const data = await response.json();
        setCoupons(data);
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : "Error al cargar cupones."
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchCoupons();
  }, [complexId]);

  const handleCreateCoupon = async (
    values: CouponFormData,
    { setSubmitting, resetForm }: FormikHelpers<CouponFormData>
  ) => {
    toast.loading("Creando cupón...");
    try {
      const payload = {
        ...values,
        validUntil: values.validUntil ? new Date(values.validUntil) : null,
        discountType: values.discountType as "PERCENTAGE" | "FIXED_AMOUNT",
      };

      const response = await fetch(`/api/complex/${complexId}/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      toast.dismiss();
      const newCoupon = await response.json();

      if (!response.ok) {
        throw new Error(newCoupon.error || "No se pudo crear el cupón.");
      }

      setCoupons((prev) => [newCoupon, ...prev]);
      toast.success("¡Cupón creado con éxito!");
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      toast.dismiss();
      toast.error(
        error instanceof Error ? error.message : "Error desconocido."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (
    couponId: string,
    currentStatus: boolean
  ) => {
    setCoupons((prev) =>
      prev.map((c) =>
        c.id === couponId ? { ...c, isActive: !currentStatus } : c
      )
    );

    try {
      const response = await fetch(
        `/api/complex/${complexId}/coupons/${couponId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: !currentStatus }),
        }
      );

      if (!response.ok) {
        throw new Error("No se pudo actualizar el cupón.");
      }

      toast.success(`Cupón ${!currentStatus ? "activado" : "desactivado"}.`);
    } catch (error) {
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === couponId ? { ...c, isActive: currentStatus } : c
        )
      );
      toast.error(
        error instanceof Error ? error.message : "Error al actualizar."
      );
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cupones de Descuento</CardTitle>
          <CardDescription>
            Creá y gestioná códigos de descuento para atraer más clientes.
          </CardDescription>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Cupón
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Cupón de Descuento</DialogTitle>
              <DialogDescription>
                Completá los datos para crear un nuevo cupón.
              </DialogDescription>
            </DialogHeader>
            <Formik<CouponFormData>
              initialValues={{
                code: "",
                description: "",
                discountType: "PERCENTAGE",
                discountValue: 0,
                validUntil: null,
                maxUses: null,
                isActive: true,
              }}
              validationSchema={couponValidationSchema}
              onSubmit={handleCreateCoupon}
            >
              {({ isSubmitting, setFieldValue, values, errors, touched }) => (
                <Form className="space-y-4">
                  <div>
                    <Label>Código</Label>
                    <Field
                      name="code"
                      placeholder="VERANO20"
                      className={cn(
                        "mt-1 block w-full px-3 py-2 bg-background border rounded-md shadow-xs sm:text-sm",
                        errors.code && touched.code
                          ? "border-red-500"
                          : "border-gray-300"
                      )}
                    />
                    <ErrorMessage
                      name="code"
                      component="p"
                      className="mt-1 text-sm text-red-600"
                    />
                  </div>

                  <div>
                    <Label>Descripción (opcional)</Label>
                    <Field
                      name="description"
                      placeholder="Descuento para nuevos clientes"
                      className="mt-1 block w-full px-3 py-2 bg-background border rounded-md shadow-xs sm:text-sm border-gray-300"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo de Descuento</Label>
                      <Select
                        onValueChange={(value) =>
                          setFieldValue("discountType", value)
                        }
                        value={values.discountType}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PERCENTAGE">
                            Porcentaje (%)
                          </SelectItem>
                          <SelectItem value="FIXED_AMOUNT">
                            Monto Fijo (ARS)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Valor</Label>
                      <Field
                        name="discountValue"
                        type="number"
                        placeholder="20"
                        className="mt-1 block w-full px-3 py-2 bg-background border rounded-md shadow-xs sm:text-sm border-gray-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Válido Hasta (opcional)</Label>
                      <Field name="validUntil">
                        {({ field, form }: FieldProps<Date | null>) => (
                          <input
                            {...field}
                            type="date"
                            value={
                              field.value
                                ? new Date(field.value)
                                    .toISOString()
                                    .split("T")[0]
                                : ""
                            }
                            onChange={(e) => {
                              const value = e.target.value
                                ? new Date(e.target.value)
                                : null;
                              form.setFieldValue(field.name, value);
                            }}
                          />
                        )}
                      </Field>
                    </div>
                    <div>
                      <Label>Máximo de Usos (opcional)</Label>
                      <Field name="maxUses">
                        {({ field, form }: FieldProps<number | null>) => (
                          <input
                            {...field}
                            type="number"
                            placeholder="100"
                            className="mt-1 block w-full px-3 py-2 bg-background border rounded-md shadow-xs sm:text-sm border-gray-300"
                            value={field.value ?? ""} 
                            onChange={(e) => {
                              const value = e.target.value
                                ? Number(e.target.value)
                                : null;
                              form.setFieldValue(field.name, value);
                            }}
                          />
                        )}
                      </Field>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="isActive"
                      checked={values.isActive}
                      onCheckedChange={(checked) =>
                        setFieldValue("isActive", checked)
                      }
                    />
                    <Label htmlFor="isActive">Activo</Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsFormOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <Spinner className="mr-2 h-4 w-4" />
                      ) : (
                        "Crear Cupón"
                      )}
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent className="space-y-4">
        {isLoading && (
          <div className="text-center py-8">
            <Spinner />
          </div>
        )}

        {!isLoading && coupons.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <Tag className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Sin cupones
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Aún no has creado ningún cupón de descuento.
            </p>
          </div>
        )}

        {coupons.map((coupon) => (
          <CouponRow
            key={coupon.id}
            coupon={coupon}
            onToggleActive={handleToggleActive}
          />
        ))}
      </CardContent>
    </Card>
  );
}
