export function StatsCard({ title, value, description, icon: Icon }) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          {Icon && (
            <div className="p-3 bg-blue-50 rounded-full">
              <Icon className="w-6 h-6 text-blue-500" />
            </div>
          )}
          <div className="w-full ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <h3 className="text-2xl font-bold mt-2">{value}</h3>
            {description && (
              <p className="text-sm text-gray-500 mt-1">{description}</p>
            )}
          </div>
        </div>
      </div>
    );
  }