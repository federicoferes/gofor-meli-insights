
import React, { useState } from 'react';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/integrations/supabase/client';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Check, Mail } from "lucide-react";

const formSchema = z.object({
  firstName: z.string().min(2, {
    message: "El nombre debe tener al menos 2 caracteres.",
  }),
  lastName: z.string().min(2, {
    message: "El apellido debe tener al menos 2 caracteres.",
  }),
  companyName: z.string().min(2, {
    message: "El nombre de la empresa debe tener al menos 2 caracteres.",
  }),
  email: z.string().email({
    message: "Por favor ingresá un email válido.",
  }),
  password: z.string().min(6, {
    message: "La contraseña debe tener al menos 6 caracteres.",
  }),
});

export type UserRegistrationFormValues = z.infer<typeof formSchema>;

export function UserRegistrationForm() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isWaitlistDialogOpen, setIsWaitlistDialogOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");

  const form = useForm<UserRegistrationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      companyName: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: UserRegistrationFormValues) {
    try {
      // Register the user with Supabase Auth with email verification enabled
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            first_name: values.firstName,
            last_name: values.lastName,
            company_name: values.companyName,
          },
          emailRedirectTo: window.location.origin + '/login'
        }
      });

      if (error) {
        throw error;
      }

      // Save the email to show in the dialog
      setRegisteredEmail(values.email);
      
      // Show waitlist dialog
      setIsWaitlistDialogOpen(true);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error al registrarse",
        description: error.message || "Ocurrió un error al crear la cuenta.",
      });
      console.error("Registration error:", error);
    }
  }

  // Redirect to dashboard demo when dialog is closed
  const handleCloseWaitlistDialog = () => {
    setIsWaitlistDialogOpen(false);
    navigate('/dashboard?demo=true');
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-md mx-auto">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre</FormLabel>
                <FormControl>
                  <Input placeholder="Juan" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Apellido</FormLabel>
                <FormControl>
                  <Input placeholder="Pérez" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre de la empresa</FormLabel>
                <FormControl>
                  <Input placeholder="Mi Tienda" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="ejemplo@mail.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contraseña</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="******" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full bg-gofor-purple hover:bg-gofor-lightPurple">
            Registrarse
          </Button>
        </form>
      </Form>

      {/* Waitlist Dialog */}
      <Dialog open={isWaitlistDialogOpen} onOpenChange={setIsWaitlistDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-center gap-2">
              <Check className="h-6 w-6 text-green-500" />
              ¡Solicitud recibida!
            </DialogTitle>
            <DialogDescription className="text-center">
              <div className="flex flex-col items-center py-4 space-y-4">
                <div className="bg-gray-50 p-4 rounded-full">
                  <Mail className="h-8 w-8 text-gofor-purple" />
                </div>
                <p>
                  Te hemos agregado a la lista de espera. Te enviaremos un correo a <span className="font-semibold">{registeredEmail}</span> cuando tu cuenta esté lista.
                </p>
                <p className="text-sm mt-2">
                  Por favor, verifica tu correo para confirmar tu dirección de email.
                </p>
              </div>
              <Button 
                onClick={handleCloseWaitlistDialog} 
                className="w-full mt-4 bg-gofor-purple hover:bg-gofor-lightPurple"
              >
                Ver demo del dashboard
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default UserRegistrationForm;
