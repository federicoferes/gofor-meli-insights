
import React from 'react';
import { Link } from 'react-router-dom';
import UserRegistrationForm from '@/components/UserRegistrationForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Register = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Crea tu cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="font-medium text-gofor-purple hover:text-gofor-lightPurple">
            Iniciar sesión
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Registro</CardTitle>
            <CardDescription>
              Ingresa tus datos para unirte a la lista de espera de Go For MeLi Insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserRegistrationForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
