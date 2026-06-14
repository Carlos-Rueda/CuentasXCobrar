export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <div className="bg-white rounded-2xl shadow-lg p-10 w-full max-w-md">

        <h1 className="text-3xl font-bold text-center mb-8">
          Iniciar Sesión
        </h1>

        <form className="space-y-5">

          <div>
            <label className="block mb-2 font-medium">
              Usuario
            </label>

            <input
              type="text"
              className="w-full border rounded-xl p-3"
            />
          </div>

          <div>
            <label className="block mb-2 font-medium">
              Contraseña
            </label>

            <input
              type="password"
              className="w-full border rounded-xl p-3"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 text-white rounded-xl p-3"
          >
            Ingresar
          </button>

        </form>

      </div>
    </div>
  );
}