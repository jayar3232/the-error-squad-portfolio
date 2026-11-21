/* Open-Meteo units: degrees Celsius, percent and kilometres per hour. */
(() => {
  'use strict';
  const services = window.StudioServices ||= {};
  const groups = [
    [[0], 'Clear sky', '☀️'],
    [[1], 'Mainly clear', '🌤️'],
    [[2], 'Partly cloudy', '⛅'],
    [[3], 'Overcast', '☁️'],
    [[45, 48], 'Fog', '🌫️'],
    [[51, 53, 55], 'Drizzle', '🌦️'],
    [[56, 57], 'Freezing drizzle', '🌧️'],
    [[61, 63, 65], 'Rain', '🌧️'],
    [[66, 67], 'Freezing rain', '🌧️'],
    [[71, 73, 75, 77], 'Snow', '❄️'],
    [[80, 81, 82], 'Rain showers', '🌧️'],
    [[85, 86], 'Snow showers', '🌨️'],
    [[95, 96, 99], 'Thunderstorm', '⛈️']
  ];
  function describe(code) {
    const group = groups.find(([codes]) => codes.includes(code));
    return {code, condition: group?.[1] || 'Conditions unavailable', icon: group?.[2] || '◌'};
  }
  async function read(endpoint, params) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(endpoint + '?' + new URLSearchParams(params), {
        signal: controller.signal, credentials: 'omit'
      });
      if (!response.ok) throw new Error('Weather service returned HTTP ' + response.status + '.');
      return await response.json();
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('Weather service took too long to respond.');
      if (error instanceof TypeError) throw new Error('Weather service is unreachable. Check your internet connection.');
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  services.weather = async function weather(city) {
    const query = String(city || '').trim();
    if (query.length < 2 || query.length > 120) throw new Error('Enter a city name between 2 and 120 characters.');
    const [place, country] = query.split(',').map(part => part.trim());
    const locations = await read('https://geocoding-api.open-meteo.com/v1/search', {
      name: place, count: country ? 20 : 1, language: 'en', format: 'json'
    });
    const location = country ? locations.results?.find(row => [row.country, row.country_code].some(name => name?.toLowerCase() === country.toLowerCase())) : locations.results?.[0];
    if (!location || !Number.isFinite(location.latitude) || !Number.isFinite(location.longitude)) {
      throw new Error('City not found. Try the city name followed by a comma and country.');
    }
    const data = await read('https://api.open-meteo.com/v1/forecast', {
      latitude: location.latitude, longitude: location.longitude, timezone: 'auto',
      current: 'temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code',
      daily: 'temperature_2m_max,temperature_2m_min,weather_code',
      temperature_unit: 'celsius', wind_speed_unit: 'kmh', forecast_days: 5
    });
    const current = data.current;
    if (!current || ![current.temperature_2m, current.relative_humidity_2m, current.wind_speed_10m].every(Number.isFinite)) {
      throw new Error('The weather service did not supply complete current conditions.');
    }
    const daily = data.daily;
    const forecast = (daily?.time || []).flatMap((date, i) => {
      const min = daily.temperature_2m_min?.[i], max = daily.temperature_2m_max?.[i];
      return Number.isFinite(min) && Number.isFinite(max)
        ? [{date, min, max, ...describe(daily.weather_code?.[i])}] : [];
    });
    return {
      city: location.name, country: location.country || location.country_code || '',
      temperature: current.temperature_2m, humidity: current.relative_humidity_2m,
      wind: current.wind_speed_10m, ...describe(current.weather_code),
      time: current.time, timezone: data.timezone, forecast, source: 'Open-Meteo'
    };
  };
})();
