import TaskItem from './TaskItem'
import styles from './TaskList.module.css'

function TaskList({ tasks, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return <p className={styles.empty}>No tasks to show</p>
  }

  return (
    <ul className={styles.list}>
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  )
}

export default TaskList
