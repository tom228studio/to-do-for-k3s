import { useState, useEffect } from 'react';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');

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

  return (
    <div style={{ maxWidth: '500px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h1>📝 To-Do List</h1>
      <form onSubmit={addTodo} style={{ marginBottom: '20px' }}>
        <input 
          value={newTodo} 
          onChange={(e) => setNewTodo(e.target.value)} 
          placeholder="What needs to be done?" 
          style={{ padding: '8px', width: '70%' }}
        />
        <button type="submit" style={{ padding: '8px 15px' }}>Add</button>
      </form>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map(todo => (
          <li key={todo.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
            <span 
              onClick={() => toggleTodo(todo.id)} 
              style={{ cursor: 'pointer', textDecoration: todo.completed ? 'line-through' : 'none', flex: 1 }}
            >
              {todo.title}
            </span>
            <button onClick={() => deleteTodo(todo.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>✖</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;