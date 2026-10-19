// Bandeau d'en-tête avec photo : remplace PageHeader sur les pages « vitrine ».
// `image` : chemin d'une photo de /public/images. `position` : cadrage de la photo (ex. 'center 60%').
export default function PageBanner({ title, subtitle, image, position = 'center', children }) {
  return (
    <header className="banner" style={{ '--banner-img': `url(${image})`, '--banner-pos': position }}>
      <div className="banner-in">
        <div>
          <h1>{title}</h1>
          {subtitle && <p className="banner-sub">{subtitle}</p>}
        </div>
        {children && <div className="page-actions">{children}</div>}
      </div>
    </header>
  )
}