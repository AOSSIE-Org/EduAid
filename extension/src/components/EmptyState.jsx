

/**
 * Reusable empty state component for when data is unavailable or malformed.
 *
 * @param {Object} props
 * @param {string} props.message - The message to display to the user.
 * @returns {React.ReactElement}
 *
 * @example
 * <EmptyState message="No results could be parsed from the response. Please try again." />
 */
function EmptyState({ message }) {
  return (
    <div className="flex items-center justify-center px-4 py-8 mx-3 my-4 rounded-xl bg-[#202838]">
      <div className="text-center">
        <div className="text-3xl mb-3">📭</div>
        <p className="text-white text-sm font-medium leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
}

export default EmptyState;
