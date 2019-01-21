import * as React from 'react';

import {FieldDescriptor, FieldDescriptors, ValueMapper} from '../types';
import {mapObject, replace} from '../utilities';

interface Props<Fields> {
  field: FieldDescriptor<Fields[]>;
  children(fields: FieldDescriptors<Fields>, index: number): React.ReactNode;
  getChildKey?(item: Fields): string;
}

export default class List<Fields> extends React.Component<
  Props<Fields>,
  never
> {
  private changeHandlers = new Map<number, {(newValue: any): void}>();

  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
  }

  shouldComponentUpdate(nextProps) {
    const {
      field: {
        value: nextValue,
        error: nextError,
        initialValue: nextInitialValue,
      },
    } = nextProps;
    const {
      field: {value, error, initialValue},
    } = this.props;

    return (
      nextValue !== value ||
      nextError !== error ||
      nextInitialValue !== initialValue
    );
  }

  render() {
    const {
      field: {value, initialValue, error, name, onBlur},
      getChildKey,
      children,
    } = this.props;

    return value.map((fieldValues, index) => {
      const innerFields: FieldDescriptors<Fields> = mapObject(
        fieldValues,
        (value, fieldPath) => {
          const initialFieldValue = initialValue[index][fieldPath];
          return {
            value,
            onBlur,
            name: `${name}.${index}.${fieldPath}`,
            initialValue: initialFieldValue,
            dirty: value !== initialFieldValue,
            error: error[index][fieldPath],
            onChange: this.handleChange({index, key: fieldPath}),
          };
        },
      );

      const key = getChildKey ? getChildKey(fieldValues) : index;

      return (
        // eslint-disable-next-line
        <React.Fragment key={key}>
          {children(innerFields, index)}
        </React.Fragment>
      );
    });
  }

  private handleChange<Key extends keyof Fields>({
    index,
    key,
  }: {
    index: number;
    key: Key;
  }) {
    if (this.changeHandlers.has(index)) {
      return this.changeHandlers.get(index);
    }
    const handler = (newValue: Fields[Key] | ValueMapper<Fields[Key]>) => {
      const {
        field: {onChange},
      } = this.props;

      onChange(value => {
        const existingItem = value[index];
        const newItem = {
          ...(existingItem as any),
          [key]:
            typeof newValue === 'function'
              ? (newValue as ValueMapper<Fields[Key]>)(value[index][key])
              : newValue,
        };
        return replace(value, index, newItem);
      });
    };
    this.changeHandlers.set(index, handler);
    return handler;
  }
}
