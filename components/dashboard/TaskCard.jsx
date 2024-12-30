export function TaskCard({ task, onEdit, onDelete }) {
    return (
      <div className="bg-white shadow-md rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{task.title}</h3>
        <p className="text-gray-600 mb-2">{task.description}</p>
        <p className="text-sm text-gray-500 mb-1">Platform: {task.platform}</p>
        <p className="text-sm text-gray-500 mb-4">Coins: {task.coins}</p>
        
        <div className="flex flex-wrap gap-2">
          <a
            href={task.url}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white font-medium py-2 px-4 rounded-md transition duration-300"
          >
            Open
          </a>
          <button
            onClick={() => onEdit(task)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-2 px-4 rounded-md transition duration-300"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(task._id)}
            className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition duration-300"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }