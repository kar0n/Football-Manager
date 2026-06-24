/**
 * Drag-and-drop event handlers for the matchup board.
 * These are factory functions that return handler callbacks,
 * bound to the React state setters passed in.
 */

/**
 * Creates the four dnd-kit event handlers.
 *
 * @param {Function} setMatchup - React state setter for the matchup object
 * @param {Function} setHasUnsavedChanges - React state setter for the dirty flag
 * @param {Function} setActiveId - React state setter for the currently dragged player id
 * @returns {{ onDragStart, onDragOver, onDragEnd, onDragCancel }}
 */
export const createDragHandlers = (setMatchup, setHasUnsavedChanges, setActiveId) => {

  const onDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const onDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    setMatchup((prev) => {
      const findContainer = (id) => {
        if (prev.teamA.players.find(p => p.id === id)) return 'teamA';
        if (prev.teamB.players.find(p => p.id === id)) return 'teamB';
        if (id === 'teamA' || id === 'teamB') return id;
        return null;
      };

      const activeContainer = findContainer(activeId);
      const overContainer = findContainer(overId);

      if (!activeContainer || !overContainer || activeContainer === overContainer) {
        return prev;
      }

      const activeItems = [...prev[activeContainer].players];
      const overItems = [...prev[overContainer].players];
      const activeIndex = activeItems.findIndex(p => p.id === activeId);
      const overIndex = overId === overContainer ? overItems.length : overItems.findIndex(p => p.id === overId);

      const item = activeItems[activeIndex];
      activeItems.splice(activeIndex, 1);
      overItems.splice(overIndex, 0, item);

      return {
        ...prev,
        [activeContainer]: { ...prev[activeContainer], players: activeItems },
        [overContainer]: { ...prev[overContainer], players: overItems },
      };
    });
  };

  const onDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    setMatchup((prev) => {
      const activeId = active.id;
      const overId = over.id;

      const findContainer = (id, state) => {
        if (state.teamA.players.find(p => p.id === id)) return 'teamA';
        if (state.teamB.players.find(p => p.id === id)) return 'teamB';
        return null;
      };

      const activeContainer = findContainer(activeId, prev);
      const overContainer = findContainer(overId, prev);

      if (!activeContainer || !overContainer || activeContainer !== overContainer) {
        setHasUnsavedChanges(true);
        return prev;
      }

      const activeIndex = prev[activeContainer].players.findIndex(p => p.id === activeId);
      const overIndex = prev[overContainer].players.findIndex(p => p.id === overId);

      if (activeIndex !== overIndex) {
        const items = [...prev[activeContainer].players];
        const item = items[activeIndex];
        items.splice(activeIndex, 1);
        items.splice(overIndex, 0, item);
        const finalMatchup = {
          ...prev,
          [activeContainer]: { ...prev[activeContainer], players: items },
        };
        setHasUnsavedChanges(true);
        return finalMatchup;
      }

      setHasUnsavedChanges(true);
      return prev;
    });
  };

  const onDragCancel = () => {
    setActiveId(null);
  };

  return { onDragStart, onDragOver, onDragEnd, onDragCancel };
};
