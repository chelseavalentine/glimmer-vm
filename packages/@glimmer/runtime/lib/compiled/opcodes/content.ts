import { isCurriedComponentDefinition } from '../../component/interfaces';
import { Opaque } from '@glimmer/interfaces';
import { isConst, Reference, VersionedPathReference, Tag, VersionedReference } from '@glimmer/reference';
import { Op } from '@glimmer/vm';
import { DynamicContentWrapper } from '../../vm/content/dynamic';
import { APPEND_OPCODES, UpdatingOpcode } from '../../opcodes';
import { ConditionalReference } from '../../references';
import { UpdatingVM } from '../../vm';

export class IsCurriedComponentDefinitionReference extends ConditionalReference {
  static create(inner: Reference<Opaque>): IsCurriedComponentDefinitionReference {
    return new IsCurriedComponentDefinitionReference(inner);
  }

  toBool(value: Opaque): boolean {
    return isCurriedComponentDefinition(value);
  }
}

APPEND_OPCODES.add(Op.DynamicContent, (vm, { op1: isTrusting }) => {
  let reference = vm.stack.pop<VersionedPathReference<Opaque>>();
  let value = reference.value();
  let content: DynamicContentWrapper;

  if (isTrusting) {
    content = vm.elements().appendTrustingDynamicContent(value);
  } else {
    content = vm.elements().appendCautiousDynamicContent(value);
  }

  if (!isConst(reference)) {
    vm.updateWith(new UpdateDynamicContentOpcode(reference, content));
  }
});

class UpdateDynamicContentOpcode extends UpdatingOpcode {
  public tag: Tag;

  constructor(private reference: VersionedReference<Opaque>, private content: DynamicContentWrapper) {
    super();
    this.tag = reference.tag;
  }

  evaluate(vm: UpdatingVM): void {
    let { content, reference } = this;
    content.update(vm.env, reference.value());
  }
}
