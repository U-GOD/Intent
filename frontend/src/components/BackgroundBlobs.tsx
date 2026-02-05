export function BackgroundBlobs() {
  return (
    <>
      <div className="blob w-96 h-96 bg-blue-200 rounded-full fixed top-0 left-0 -translate-x-1/2 -translate-y-1/2 mix-blend-multiply" />
      <div 
        className="blob w-[30rem] h-[30rem] bg-indigo-100 rounded-full fixed top-1/2 right-0 translate-x-1/3 -translate-y-1/2 mix-blend-multiply"
        style={{ animationDelay: '1s' }}
      />
      <div 
        className="blob w-80 h-80 bg-[#4DA2FF]/20 rounded-full fixed bottom-0 left-1/3 translate-y-1/3 mix-blend-multiply"
        style={{ animationDelay: '2s' }}
      />
    </>
  );
}
