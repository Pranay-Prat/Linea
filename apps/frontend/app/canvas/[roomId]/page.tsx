import Canvas from "@/components/whiteboard/Canvas";

export default async function WhiteBoardCient({params}:{params:{roomId:string}}) {
  const roomId = (await params).roomId
  return (
    <div className="h-full w-full">
      <Canvas roomId={roomId} />
    </div>
  );
}