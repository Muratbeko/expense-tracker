const API_URL = 'http://localhost:8080/api/users';

export const fetchUserProfile = async (email: string) => {
  const response = await fetch(`${API_URL}/me?email=${email}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user profile');
  }

  return await response.json();
};
const uploadProfilePhoto = async (formData: FormData, email: string) => {
    const url = new URL(`${API_URL}/me/photo`);
    url.searchParams.append('email', email);
  
    const response = await fetch(url.toString(), {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json', // Убираем Content-Type
      },
    });
  
    if (!response.ok) {
      throw new Error('Не удалось загрузить фото профиля');
    }
  
    return response.json();
  };
  