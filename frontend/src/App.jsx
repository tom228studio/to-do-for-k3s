import { useState, useEffect } from 'react';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  // Добавляем состояние для темы. По умолчанию true (темная тема)
  const [isDarkMode, setIsDarkMode] = useState(true); 

  const fetchTodos = async () => {
    const res = await fetch('/api/todos');
    setTodos(await res.json());
  };

  useEffect(() => { fetchTodos(); }, []);

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    await fetch('/api/todos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTodo }),
    });
    setNewTodo('');
    fetchTodos();
  };

  const toggleTodo = async (id) => {
    await fetch(`/api/todos/${id}`, { method: 'PUT' });
    fetchTodos();
  };

  const deleteTodo = async (id) => {
    await fetch(`/api/todos/${id}`, { method: 'DELETE' });
    fetchTodos();
  };

  // Объект с цветами для тем
  const theme = isDarkMode ? {
    bg: '#121212',
    cardBg: '#1e1e1e',
    text: '#e0e0e0',
    inputBg: '#2c2c2c',
    inputBorder: '#444',
    border: '#333',
    primary: '#bb86fc', // Акцентный цвет (фиолетовый)
    danger: '#cf6679',
    placeholder: '#888'
  } : {
    bg: '#f4f4f9',
    cardBg: '#ffffff',
    text: '#333333',
    inputBg: '#ffffff',
    inputBorder: '#ccc',
    border: '#eee',
    primary: '#007bff',
    danger: 'red',
    placeholder: '#999'
  };

  return (
    // Основной контейнер
    <div style={{ 
      maxWidth: '500px', 
      margin: '50px auto', 
      fontFamily: 'sans-serif', 
      backgroundColor: theme.cardBg, 
      color: theme.text, 
      padding: '30px', 
      borderRadius: '12px',
      boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.1)',
      minHeight: '400px'
    }}>
      
      {/* Заголовок и кнопка переключения темы */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>📝 To-Do List</h1>
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)} 
          style={{ 
            padding: '8px 12px', 
            cursor: 'pointer', 
            backgroundColor: theme.inputBg, 
            color: theme.text, 
            border: `1px solid ${theme.inputBorder}`, 
            borderRadius: '6px',
            fontSize: '16px'
          }}
          title="Переключить тему"
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Форма добавления */}
      <form onSubmit={addTodo} style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <input 
          value={newTodo} 
          onChange={(e) => setNewTodo(e.target.value)} 
          placeholder="What needs to be done?" 
          style={{ 
            padding: '10px', 
            flex: 1, 
            backgroundColor: theme.inputBg, 
            color: theme.text, 
            border: `1px solid ${theme.inputBorder}`, 
            borderRadius: '6px',
            outline: 'none',
            fontSize: '14px'
          }}
        />
        <button 
          type="submit" 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: theme.primary, 
            color: '#fff', 
            border: 'none', 
            borderRadius: '6px', 
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          Add
        </button>
      </form>

      {/* Список задач */}
      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {todos.map(todo => (
          <li key={todo.id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '10px', 
            borderBottom: `1px solid ${theme.border}`, 
            paddingBottom: '10px' 
          }}>
            <span 
              onClick={() => toggleTodo(todo.id)} 
              style={{ 
                cursor: 'pointer', 
                textDecoration: todo.completed ? 'line-through' : 'none', 
                flex: 1,
                opacity: todo.completed ? 0.5 : 1,
                transition: 'opacity 0.2s'
              }}
            >
              {todo.title}
            </span>
            <button 
              onClick={() => deleteTodo(todo.id)} 
              style={{ 
                color: theme.danger, 
                border: 'none', 
                background: 'none', 
                cursor: 'pointer', 
                fontSize: '18px',
                padding: '5px'
              }}
            >
              ✖
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;