import { SearchIcon } from '@/icons'
import { TextInput } from '../TextInput'

export type SearchBoxProps = { onSearch: (val: string) => void; placeholder: string }
export function SearchBox({ onSearch, placeholder }: SearchBoxProps) {
  return (
    <div className="relative w-80">
      <TextInput
        type="search"
        onChange={(e: any) => onSearch(e.target.value)}
        className="absolute h-full w-full pl-10 rounded-md"
        placeholder={placeholder}
      />
      <SearchIcon height={25} width={25} className="absolute left-2 top-1/2 -translate-y-1/2" />
    </div>
  )
}
