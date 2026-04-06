import {
  useDroppable,
} from "@dnd-kit/core";

const DroppableZone = ({ id, children, className, isOverColor, data = {} }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
    data: data
  });

  return (
    <div
      ref={setNodeRef}
      className={`${className} transition-all duration-200 ${
        isOver ? isOverColor : ""
      }`}
    >
      {children}
    </div>
  );
};
export default DroppableZone;