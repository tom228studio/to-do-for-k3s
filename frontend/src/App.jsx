import { useState, useEffect } from 'react';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true); 

  // ✅ 1. СНАЧАЛА объявляем тему, чтобы она была доступна везде ниже
  const theme = isDarkMode ? {
    bg: '#121212',
    cardBg: '#1e1e1e',
    text: '#e0e0e0',
    inputBg: '#2c2c2c',
    inputBorder: '#444',
    border: '#333',
    primary: '#bb86fc',
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

  // ✅ 2. ТЕПЕРЬ безопасно используем theme в useEffect
  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.backgroundColor = theme.bg;
    document.body.style.transition = 'background-color 0.3s ease';
  }, [isDarkMode, theme.bg]);

  const fetchTodos = async () => {
    try {
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error(`Ошибка сервера: ${res.status}`);
      const data = await res.json();
      setTodos(data);
    } catch (err) {
      console.error("Не удалось загрузить задачи:", err);
    }
  };

  useEffect(() => { 
    fetchTodos(); 
  }, []);

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;
    try {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTodo }),
      });
      setNewTodo('');
      fetchTodos();
    } catch (err) {
      console.error("Ошибка при добавлении:", err);
    }
  };

  const toggleTodo = async (id) => {
    try {
      await fetch(`/api/todos/${id}`, { method: 'PUT' });
      fetchTodos();
    } catch (err) {
      console.error("Ошибка при обновлении:", err);
    }
  };

  const deleteTodo = async (id) => {
    try {
      await fetch(`/api/todos/${id}`, { method: 'DELETE' });
      fetchTodos();
    } catch (err) {
      console.error("Ошибка при удалении:", err);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: theme.bg,
      padding: '20px',
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'center',
      transition: 'background-color 0.3s ease'
    }}>
      <div style={{ 
        maxWidth: '500px', 
        width: '100%',
        margin: '50px auto', 
        fontFamily: 'sans-serif', 
        backgroundColor: theme.cardBg, 
        color: theme.text, 
        padding: '30px', 
        borderRadius: '12px',
        boxShadow: isDarkMode ? '0 4px 20px rgba(0,0,0,0.5)' : '0 4px 20px rgba(0,0,0,0.1)',
        minHeight: '400px',
        transition: 'all 0.3s ease'
      }}>
        
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
    </div>
  );
}

export default App;