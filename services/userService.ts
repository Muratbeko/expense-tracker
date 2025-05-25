// services/userService.ts

const API_URL = 'http://192.168.0.109:8080/api/users';  // Замените на ваш API URL

export const fetchUserProfile = async (email: string) => {
  try {
    // Ручное добавление параметров в URL
    const url = new URL(`${API_URL}/me`);
    url.searchParams.append('email', email);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Error loading user');
  }
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
