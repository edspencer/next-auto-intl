import styles from './TaskItem.module.css'

function TaskItem({ task, onToggle, onDelete }) {
  return (
    <li className={styles.item}>
      <label className={styles.label}>
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className={styles.checkbox}
        />
        <span className={task.completed ? styles.completed : ''}>
          {task.text}
        </span>
      </label>
      <button
        onClick={() => onDelete(task.id)}
        className={styles.deleteButton}
        aria-label="Delete task"
      >
        ×
      </button>
    </li>
  )
}

export default TaskItem
