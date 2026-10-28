import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { Dropdown, type DropdownProps } from './Dropdown';

/** A Dropdown bound to a react-hook-form field; errors focus its trigger like any other control. */
export function FormDropdown<T extends FieldValues>({
  control,
  name,
  ...rest
}: { control: Control<T>; name: FieldPath<T> } & Omit<DropdownProps, 'value' | 'onChange' | 'name' | 'triggerRef'>) {
  const { field } = useController({ control, name });
  return <Dropdown {...rest} name={field.name} triggerRef={field.ref} value={(field.value as string | undefined) ?? ''} onChange={field.onChange} />;
}
